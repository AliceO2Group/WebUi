import { useCallback, useMemo, useState } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import { Controller, useForm } from 'react-hook-form';

import { useRegisterServiceRouteMutation } from '~/feature/service-routes/api/mutations';
import { useRouteServiceOptionsQuery } from '~/feature/service-routes/api/queries';
import { useAuth } from '~/feature/auth/hooks/session';
import { useAlert } from '~/shared/hooks/useAlert';
import useModal from '~/shared/hooks/useModal';
import { StaticTextField } from '~/shared/components/form/static-text-field';
import { useDebouncedValue } from '~/shared/hooks/useDebouncedValue';
import { AUTH_ERROR_ALERT } from '~/ui/alert/constants';
import { IconLoop } from '~/ui/icon';
import type { Service } from '~/feature/service/types/service';

type ServiceOption = { value: string; label: string };

type ServiceRouteCreationFormValues = {
	serviceFrom: ServiceOption | null;
	serviceTo: ServiceOption | null;
	permissions: string[];
};

type ServiceSelectFieldName = 'serviceFrom' | 'serviceTo';
type ServiceSelectInputs = Record<ServiceSelectFieldName, string>;

const ROUTE_PERMISSION_OPTIONS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

const ROUTE_CREATION_DEFAULTS: ServiceRouteCreationFormValues = {
	serviceFrom: null,
	serviceTo: null,
	permissions: [],
};

const SERVICE_SELECT_INPUT_DEFAULTS: ServiceSelectInputs = {
	serviceFrom: '',
	serviceTo: '',
};

const SERVICE_SELECT_DEBOUNCE_MS = 300;
const SERVICE_SELECT_MIN_SEARCH_CHARS = 3;

export function ServiceRouteRegisterForm() {
	const hasAuth = useAuth();
	const pushAlert = useAlert();
	const { showModal } = useModal();
	const { mutate: registerRoute, isPending: isRegistering } = useRegisterServiceRouteMutation();

	const {
		control: creationControl,
		handleSubmit: handleCreationSubmit,
		reset: resetCreationForm,
		setValue,
		watch,
		formState: { isValid },
	} = useForm<ServiceRouteCreationFormValues>({
		defaultValues: ROUTE_CREATION_DEFAULTS,
		mode: 'onChange',
	});

	const [serviceSelectInputs, setServiceSelectInputs] = useState<ServiceSelectInputs>(() => ({ ...SERVICE_SELECT_INPUT_DEFAULTS }));

	const debouncedServiceInputs = {
		serviceFrom: useDebouncedValue(serviceSelectInputs.serviceFrom.trim(), SERVICE_SELECT_DEBOUNCE_MS),
		serviceTo: useDebouncedValue(serviceSelectInputs.serviceTo.trim(), SERVICE_SELECT_DEBOUNCE_MS),
	};

	const serviceFromSearchTerm = debouncedServiceInputs.serviceFrom;
	const serviceToSearchTerm = debouncedServiceInputs.serviceTo;
	const serviceFromQueryEnabled = serviceFromSearchTerm.length >= SERVICE_SELECT_MIN_SEARCH_CHARS;
	const serviceToQueryEnabled = serviceToSearchTerm.length >= SERVICE_SELECT_MIN_SEARCH_CHARS;

	const serviceFromOptionsQuery = useRouteServiceOptionsQuery({
		searchTerm: serviceFromSearchTerm,
		enabled: serviceFromQueryEnabled,
	});
	const serviceToOptionsQuery = useRouteServiceOptionsQuery({
		searchTerm: serviceToSearchTerm,
		enabled: serviceToQueryEnabled,
	});

	const serviceFromValue = watch('serviceFrom');
	const serviceToValue = watch('serviceTo');

	const mapServiceToOption = useCallback((service: Service): ServiceOption => ({
		value: service.serviceId,
		label: service.commonName,
	}), []);

	const serviceFromOptions = useMemo(() => {
		const base = serviceFromQueryEnabled ? (serviceFromOptionsQuery.data ?? []).map(mapServiceToOption) : [];
		if (serviceFromValue && !base.some((option) => option.value === serviceFromValue.value)) {
			return [serviceFromValue, ...base];
		}
		return base;
	}, [mapServiceToOption, serviceFromOptionsQuery.data, serviceFromQueryEnabled, serviceFromValue]);

	const serviceToOptions = useMemo(() => {
		const base = serviceToQueryEnabled ? (serviceToOptionsQuery.data ?? []).map(mapServiceToOption) : [];
		if (serviceToValue && !base.some((option) => option.value === serviceToValue.value)) {
			return [serviceToValue, ...base];
		}
		return base;
	}, [mapServiceToOption, serviceToOptionsQuery.data, serviceToQueryEnabled, serviceToValue]);

	const handleServiceInputChange = useCallback((field: ServiceSelectFieldName, value: string) => {
		setServiceSelectInputs((prev) => ({ ...prev, [field]: value }));
	}, []);

	const handleResetCreationForm = useCallback(() => {
		resetCreationForm(ROUTE_CREATION_DEFAULTS);
		setServiceSelectInputs({ ...SERVICE_SELECT_INPUT_DEFAULTS });
	}, [resetCreationForm]);

	const handleSwapServices = useCallback(() => {
		setValue('serviceFrom', serviceToValue);
		setValue('serviceTo', serviceFromValue);
		setServiceSelectInputs({
			serviceFrom: serviceToValue?.label ?? '',
			serviceTo: serviceFromValue?.label ?? '',
		});
	}, [serviceFromValue, serviceToValue, setValue]);

	const handleRouteCreateSubmit = useCallback((values: ServiceRouteCreationFormValues) => {
		const { serviceFrom, serviceTo, permissions } = values;
		if (!serviceFrom || !serviceTo) {
			pushAlert({ message: 'Select both services before submitting.', severity: 'warning' });
			return;
		}

		if (serviceFrom.value === serviceTo.value) {
			pushAlert({ message: 'Select two different services for a route.', severity: 'warning' });
			return;
		}

		const serviceFromLabel = serviceFrom.label;
		const serviceToLabel = serviceTo.label;
		const serviceFromId = serviceFrom.value;
		const serviceToId = serviceTo.value;

		const permissionsSummary = permissions.length ? permissions.join(', ') : 'No permissions selected';

		showModal({
			title: 'Register service route',
			content: (
				<Stack spacing={1}>
					<Typography variant="body2">
						Do you want to allow <strong>{serviceFromLabel}</strong> to reach <strong>{serviceToLabel}</strong>?
					</Typography>
					<Typography variant="body2" color="text.secondary">
						Permissions: {permissionsSummary}
					</Typography>
				</Stack>
			),
			confirmLabel: 'Register route',
			cancelLabel: 'Cancel',
			accent: 'warning',
			onConfirm: () => {
				if (!hasAuth) {
					pushAlert(AUTH_ERROR_ALERT);
					return;
				}

				registerRoute(
					{ serviceFromId, serviceToId, permissions },
					{
						onSuccess: () => {
							pushAlert({ message: 'Route registered successfully.', severity: 'success' });
							handleResetCreationForm();
						},
						onError: (error) => {
							console.error('Failed to register route', error);
							pushAlert({ message: 'Failed to register route.', severity: 'error' });
						},
					},
				);
			},
		});
	}, [handleResetCreationForm, hasAuth, pushAlert, registerRoute, showModal]);

	const isCreateDisabled = !isValid || isRegistering;
	const isSwapDisabled = !serviceFromValue && !serviceToValue;

	return (
		<CreationCard elevation={0}>
			<CreationForm onSubmit={handleCreationSubmit(handleRouteCreateSubmit)}>
				<CreationCardInner>
				<CreationHeader>
					<CreationHeaderText>
						<Typography variant="h6">Register service route</Typography>
						<Typography variant="body2" color="text.secondary">
							Allow one service to reach another by selecting the participants and the permissions they should receive.
						</Typography>
					</CreationHeaderText>
				</CreationHeader>
				<CreationBody spacing={3}>
					<ServiceSelectsLayout>
						<Controller
							control={creationControl}
							name="serviceFrom"
							rules={{ required: 'Source service is required.' }}
							render={({ field, fieldState }) => (
								<Autocomplete<ServiceOption, false, false, false>
									options={serviceFromOptions}
									value={field.value ?? null}
									onChange={(_, option) => {
										field.onChange(option ?? null);
										handleServiceInputChange('serviceFrom', option?.label ?? '');
									}}
									filterOptions={(options) => options}
									inputValue={serviceSelectInputs.serviceFrom}
									onInputChange={(_, value) => handleServiceInputChange('serviceFrom', value)}
									loading={serviceFromOptionsQuery.isFetching}
									disabled={isRegistering}
									getOptionLabel={(option) => option.label}
									isOptionEqualToValue={(option, value) => option.value === value.value}
									renderInput={(params) => (
										<StaticTextField
											{...params}
											label="Service from"
											placeholder="Select source service"
											error={Boolean(fieldState.error)}
											helperText={fieldState.error?.message ?? (serviceSelectInputs.serviceFrom.length < SERVICE_SELECT_MIN_SEARCH_CHARS ? `Type at least ${SERVICE_SELECT_MIN_SEARCH_CHARS} characters` : undefined)}
											fullWidth
											slotProps={{
												input: {
													...params.InputProps,
													endAdornment: (
														<>
															{serviceFromOptionsQuery.isFetching ? <CircularProgress color="inherit" size={16} /> : null}
															{params.InputProps.endAdornment}
														</>
													),
												},
											}}
										/>
									)}
							/>
						)}
					/>
					<SwapButtonWrapper>
						<IconButton
							type="button"
							color="primary"
							onClick={handleSwapServices}
							disabled={isSwapDisabled || isRegistering}
							aria-label="Swap services"
						>
							<IconLoop />
						</IconButton>
					</SwapButtonWrapper>
					<Controller
						control={creationControl}
						name="serviceTo"
						rules={{ required: 'Destination service is required.' }}
						render={({ field, fieldState }) => (
							<Autocomplete<ServiceOption, false, false, false>
								options={serviceToOptions}
								value={field.value ?? null}
								onChange={(_, option) => {
									field.onChange(option ?? null);
									handleServiceInputChange('serviceTo', option?.label ?? '');
								}}
								filterOptions={(options) => options}
								inputValue={serviceSelectInputs.serviceTo}
								onInputChange={(_, value) => handleServiceInputChange('serviceTo', value)}
								loading={serviceToOptionsQuery.isFetching}
								disabled={isRegistering}
								getOptionLabel={(option) => option.label}
								isOptionEqualToValue={(option, value) => option.value === value.value}
								renderInput={(params) => (
									<StaticTextField
										{...params}
										label="Service to"
										placeholder="Select destination service"
										error={Boolean(fieldState.error)}
										helperText={fieldState.error?.message ?? (serviceSelectInputs.serviceTo.length < SERVICE_SELECT_MIN_SEARCH_CHARS ? `Type at least ${SERVICE_SELECT_MIN_SEARCH_CHARS} characters` : undefined)}
										fullWidth
										slotProps={{
											input: {
												...params.InputProps,
												endAdornment: (
													<>
														{serviceToOptionsQuery.isFetching ? <CircularProgress color="inherit" size={16} /> : null}
														{params.InputProps.endAdornment}
													</>
												),
											},
										}}
									/>
								)}
						/>
						)}
					/>
				</ServiceSelectsLayout>
				<PermissionsSection>
					<Typography variant="subtitle2">Allowed permissions</Typography>
					<Typography variant="body2" color="text.secondary">
						Select the HTTP verbs this route should grant to the caller.
					</Typography>
					<Controller
						control={creationControl}
						name="permissions"
						rules={{ validate: (value) => (value?.length ? true : 'Select at least one permission.') }}
						render={({ field, fieldState }) => {
							const selected = field.value ?? [];
							const handleTogglePermission = (permission: string) => {
								if (selected.includes(permission)) {
									field.onChange(selected.filter((item) => item !== permission));
									return;
								}
								field.onChange([...selected, permission]);
							};

							return (
								<PermissionsContent>
									<PermissionsOptions>
										{ROUTE_PERMISSION_OPTIONS.map((permission) => (
											<FormControlLabel
												key={permission}
												control={(
													<Checkbox
														size="small"
														checked={selected.includes(permission)}
														onChange={() => handleTogglePermission(permission)}
														disabled={isRegistering}
													/>
												)}
												label={permission}
											/>
										))}
									</PermissionsOptions>
									{fieldState.error ? <FormHelperText error>{fieldState.error.message}</FormHelperText> : null}
								</PermissionsContent>
							);
						}}
					/>
				</PermissionsSection>
				</CreationBody>
				<CreationFooter>
					<Button
					type="button"
					variant="outlined"
					size="small"
					onClick={handleResetCreationForm}
					disabled={isRegistering}
				>
					Reset
				</Button>
				<Button type="submit" variant="contained" size="small" disabled={isCreateDisabled}>
					Register route
				</Button>
				</CreationFooter>
				</CreationCardInner>
			</CreationForm>
		</CreationCard>
	);
}

const SectionCard = styled(Paper)(({ theme }) => ({
	border: `1px solid ${theme.palette.divider}`,
	padding: theme.spacing(2),
	boxShadow: 'none',
}));

const CreationCard = styled(SectionCard)(({ theme }) => ({
	minHeight: 620,
	display: 'flex',
	flexDirection: 'column',
	justifyContent: 'center',
}));

const CreationCardInner = styled('div')(({ theme }) => ({
	display: 'flex',
	flexDirection: 'column',
	gap: theme.spacing(2),
	width: '100%',
	maxWidth: 520,
	margin: '0 auto',
}));

const CreationForm = styled('form')(({ theme }) => ({
	display: 'flex',
	flexDirection: 'column',
	gap: theme.spacing(2),
}));

const CreationHeader = styled('div')(({ theme }) => ({
	display: 'flex',
	flexWrap: 'wrap',
	justifyContent: 'space-between',
	gap: theme.spacing(2),
}));

const CreationHeaderText = styled('div')(({ theme }) => ({
	flex: 1,
	minWidth: 240,
}));

const CreationBody = styled(Stack)(({ theme }) => ({
	marginTop: theme.spacing(2),
}));

const ServiceSelectsLayout = styled('div')(({ theme }) => ({
	display: 'flex',
	flexDirection: 'column',
	gap: theme.spacing(1.5),
}));

const SwapButtonWrapper = styled('div')(({ theme }) => ({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	alignSelf: 'flex-start',
	padding: theme.spacing(0.5, 0),
}));

const PermissionsSection = styled('div')(({ theme }) => ({
	display: 'flex',
	flexDirection: 'column',
	gap: theme.spacing(1),
}));

const PermissionsContent = styled('div')(({ theme }) => ({
	display: 'flex',
	flexDirection: 'column',
	gap: theme.spacing(1),
}));

const PermissionsOptions = styled('div')(({ theme }) => ({
	display: 'grid',
	gap: theme.spacing(1),
	gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
}));

const CreationFooter = styled('div')(({ theme }) => ({
	marginTop: theme.spacing(2),
	display: 'flex',
	gap: theme.spacing(1),
	justifyContent: 'flex-end',
	flexWrap: 'wrap',
}));
