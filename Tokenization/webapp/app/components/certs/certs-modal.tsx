import { useFetcher } from "react-router"

import type { DialogPropsBase } from "~/utils/types";

import { Spinner } from "~/ui/spinner";
import { WindowButtonAccept, WindowCloseIcon, WindowContent, WindowTitle } from "~/components/window/window-objects";
import Modal from "~/components/window/modal";

export const CertsModal = ({open, setOpen, fetcher, renew}: DialogPropsBase & {fetcher: ReturnType<typeof useFetcher>, renew?: boolean}) => {
    return (
      <Modal
        open={open}
        setOpen={setOpen}
        className="bg-white"
      >
        <WindowTitle> {renew ? 'Renewal' : 'Certificate Registration'} </WindowTitle>
        <WindowContent>
        { fetcher.state === 'loading' || fetcher.state === 'submitting'
        ? <Spinner />
        : <div className="flex-column g2">
            <pre>
                {fetcher.data && typeof fetcher.data === 'object' && 'certContent' in fetcher.data ?
                    Object.entries((fetcher.data as { certContent: Record<string, string> }).certContent).map(([key, value]) => (
                        <div key={key}>{key}: {value}</div>
                    ))
                : 'Error parsing certificate.'}
            </pre>
          </div>
        }
        </WindowContent>
        <WindowButtonAccept/>
        <WindowCloseIcon />
      </Modal>
    )
}