# frozen_string_literal: true

require "swagger_helper"

RSpec.describe "Admin::SystemSettings" do
  let(:json_response) { JSON.parse(response.body, symbolize_names: true) }
  let(:admin) { create(:user, :admin) }
  let(:emcee) { create(:user, :emcee) }

  describe "#show" do
    path "/api/v1/admin/system_settings/{key}" do
      get "returns the value of a system setting" do
        tags "Admin::SystemSettings"
        produces "application/json"
        parameter name: :key, in: :path, type: :string, required: true

        response(200, "returns the setting value") do
          let(:key) { "at_risk_threshold_pct" }

          before { sign_in admin }

          run_test! do
            expect(response).to have_http_status :ok
            expect(json_response[:data][:key]).to eq("at_risk_threshold_pct")
            expect(json_response[:data][:value]).to eq("20")
          end
        end

        response(200, "returns stored value when setting exists") do
          let(:key) { "at_risk_threshold_pct" }

          before do
            SystemSetting.set("at_risk_threshold_pct", "30")
            sign_in admin
          end

          run_test! do
            expect(response).to have_http_status :ok
            expect(json_response[:data][:value]).to eq("30")
          end
        end

        response(404, "returns not found for unknown key") do
          let(:key) { "unknown_setting" }

          before { sign_in admin }

          run_test! do
            expect(response).to have_http_status :not_found
          end
        end

        response(403, "returns forbidden for non-admin") do
          let(:key) { "at_risk_threshold_pct" }

          before { sign_in emcee }

          run_test! do
            expect(response).to have_http_status :forbidden
          end
        end
      end
    end
  end

  describe "#update" do
    path "/api/v1/admin/system_settings/{key}" do
      patch "updates a system setting" do
        tags "Admin::SystemSettings"
        consumes "application/json"
        produces "application/json"
        parameter name: :key, in: :path, type: :string, required: true
        parameter name: :body, in: :body, schema: {
          type: :object,
          properties: { value: { type: :string } },
          required: [ "value" ]
        }

        response(200, "updates the setting") do
          let(:key) { "at_risk_threshold_pct" }
          let(:body) { { value: "25" } }

          before { sign_in admin }

          run_test! do
            expect(response).to have_http_status :ok
            expect(json_response[:data][:value]).to eq("25")
            expect(SystemSetting.get("at_risk_threshold_pct")).to eq("25")
          end
        end

        response(422, "returns unprocessable for out-of-range threshold") do
          let(:key) { "at_risk_threshold_pct" }
          let(:body) { { value: "150" } }

          before { sign_in admin }

          run_test! do
            expect(response).to have_http_status :unprocessable_entity
          end
        end

        response(404, "returns not found for unknown key") do
          let(:key) { "unknown_setting" }
          let(:body) { { value: "10" } }

          before { sign_in admin }

          run_test! do
            expect(response).to have_http_status :not_found
          end
        end

        response(403, "returns forbidden for non-admin") do
          let(:key) { "at_risk_threshold_pct" }
          let(:body) { { value: "10" } }

          before { sign_in emcee }

          run_test! do
            expect(response).to have_http_status :forbidden
          end
        end
      end
    end
  end
end
