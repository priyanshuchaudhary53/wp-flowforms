import { useState } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useFormStore } from "../store/useFormStore";
import Field from "../components/ui/field";
import Alert from "../components/ui/alert";

export default function Setup({ className }) {
  const [formName, setFormName] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const createBlankFormHandler = async () => {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(formflowData.apiUrl + "/forms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-WP-Nonce": formflowData.nonce,
        },
        body: JSON.stringify({
          form_name: formName,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Something went wrong.");
      }

      window.location.href = `/wp-admin/admin.php?page=wpff_form_builder&form_id=${data.post_id}`;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`bg-black/50 flex justify-center items-center ${className}`}
    >
      <div className="bg-white w-full max-w-xl rounded-lg py-10 px-8">
        <div className="text-center">
          <h2 className="text-gray-900 text-2xl font-medium tracking-tight">
            Create a new form
          </h2>
          {/* <p className="mt-2 text-gray-600 text-sm/6">
            Choose how you'd like to get started
          </p> */}
        </div>

        <Field
          label="Name your form"
          id="form-name"
          name="form-name"
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          placeholder="Enter your form name here..."
          className="mt-8"
        />

        <div aria-hidden="true" className="my-6 h-px w-full bg-gray-200"></div>

        <div>
          <p className="text-gray-900 text-base/7 font-medium">
            Select a template
          </p>
          <p className="text-gray-600 mt-1 text-sm/6">
            Speed up the process by choosing a pre-made template, or starting
            with a blank form.
          </p>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            disabled={loading}
            onClick={createBlankFormHandler}
            className="group ring-2 ring-inset ring-gray-200 rounded-lg p-6 cursor-pointer hover:ring-gray-400 hover:bg-gray-50 transition-all"
          >
            <div className="w-12 h-12 bg-gray-100 rounded-full flex justify-center items-center mx-auto group-hover:bg-gray-200 transition-colors">
              <PlusIcon width={24} height={24} />
            </div>
            <div className="mt-4">
              <p className="text-gray-900 text-base/7 font-medium">
                Blank form
              </p>
              <p className="text-gray-600 mt-1 text-sm/6">
                Start from scratch form and use our drag & drop bulider
              </p>
            </div>
          </button>
        </div>

        {error && (
          <Alert className="mt-4" type="error" message={error} />
        )}
      </div>
    </div>
  );
}
