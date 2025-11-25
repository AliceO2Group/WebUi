import { FormInput } from '~/components/form/form-input';
import { FormSelectMulti, FormSelect } from '~/components/form/form-select';
import { SelectGroup } from '~/components/form/select-group';
import { ResetButton, SubmitButton } from '~/components/form/form-buttons';
import { useTokenForm } from '~/hooks/tokens/token-form';
import { Form } from '../form/form';
import Modal from '~/components/window/modal';
import { WindowTitle, WindowContent, WindowButtonAccept, WindowButtonCancel, WindowCloseIcon } from '~/components/window/window-objects';
import Alert from '../window/alert';

const httpMethodOptions = [
  { value: 'GET', label: 'GET' },
  { value: 'POST', label: 'POST' },
  { value: 'PUT', label: 'PUT' },
  { value: 'DELETE', label: 'DELETE' },
];

export function TokenForm() {
  const { state, actions } = useTokenForm();
  return (
    <Form>
      <FormInput labelText="Expiration Time (hours):" value={state.expirationTime} setValue={actions.setExpirationTime} inputProps={{ type: 'number', step: 1, min: 0 }} />
      <FormSelectMulti id="http-select-methods" options={httpMethodOptions} value={state.selectedMethods} setValue={actions.setSelectedMethods} placeholder="Choose HTTP Methods..." label="HTTP Methods" />
      {state.loaderData && (
        <>
          <SelectGroup>
            <FormSelect id="first-service-select" options={state.loaderData} value={state.firstSelectedService} setValue={actions.setFirstSelectedService} placeholder="Select First Service..." label="First Service" />
            <FormSelect id="second-service-select" options={state.loaderData} value={state.secondSelectedService} setValue={actions.setSecondSelectedService} placeholder="Select Second Service..." label="Second Service" />
          </SelectGroup>
          <div className="mv3 flex-row g1 align-center">
            <SubmitButton action={actions.onSubmit} />
            <ResetButton action={actions.onReset} />
          </div>
        </>
      )}
    </Form>
  );
}

export function TokenFormWindows() {
  const { state, actions } = useTokenForm();
  return (
    <>
    <Modal open={state.openModal} setOpen={actions.setOpenModal} className="bg-primary">
      <WindowTitle>Confirm Token Creation</WindowTitle>
      <WindowContent>
        <div className="flex-column align-center justify-center">
          <div className="mb2">Are you sure you want to create the token with the specified settings?</div>
          <div>Service from: {state.firstLabel}</div>
          <div>Service to: {state.secondLabel}</div>
          <div>Expiration time: {state.expirationTime} hours</div>
          <div>HTTP methods: {state.selectedMethods.join(', ')}</div>
        </div>
      </WindowContent>
      <WindowButtonAccept className="btn-success" action={actions.callApi} />
      <WindowButtonCancel />
    </Modal>
        <Alert
      key={state.alert?.key}
      open={state.openAlert}
      setOpen={actions.setOpenAlert}
      timeout={6000}
      className={state.alert?.success ? 'bg-success' : 'bg-danger'}
    >
      <WindowTitle>{state.alert?.title}</WindowTitle>
      <WindowContent>{state.alert?.message}</WindowContent>
      <WindowCloseIcon />
    </Alert>
    </>
  );
}